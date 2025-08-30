import { AppError, ErrorSeverity } from '../errors/base-error';

/**
 * Utility functions for error handling
 */

export const generateCorrelationId = (): string => {
  if (typeof globalThis !== 'undefined' && globalThis?.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 11);
  return `${timestamp}-${randomPart}`;
};

export const redactSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization', 'auth',
    'credit_card', 'credit_card_number', 'ssn', 'social_security',
    'api_key', 'api_secret', 'private_key', 'access_token', 'refresh_token',
    'session_id', 'cookie', 'csrf_token'
  ];
  
  const redacted = Array.isArray(data) ? [...data] : { ...data };
  
  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }
  
  for (const key in redacted) {
    if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }
  
  return redacted;
};

export const isRetryEligible = (error: AppError): boolean => {
  return error.retryable && [
    503, 502, 504, 429
  ].includes(error.statusCode);
};

export const getRetryDelay = (attempt: number, baseDelay = 1000, maxDelay = 30000): number => {
  const delay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * delay;
  return Math.min(delay + jitter, maxDelay);
};

export const shouldAlert = (error: AppError): boolean => {
  return error.severity === ErrorSeverity.CRITICAL || 
         error.severity === ErrorSeverity.HIGH ||
         !error.isOperational;
};