/**
 * Security Hooks
 * React hooks for security features and validation
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { ValidationError } from '../error-handling/errors/validation-error'
import { ZodSchema } from 'zod'
import { authTokenService } from '../services/AuthTokenService'
import { rateLimitService, RateLimitConfig, RateLimitStatus } from '../services/RateLimitService'
import { auditLogService } from '../services/AuditLogService'

// Types for security hooks
interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: ValidationError;
}

// Simple sanitization functions
const sanitizeHtml = (input: string): string => {
  return input.replace(/<[^>]*>/g, '');
};

const sanitizeSql = (input: string): string => {
  return input.replace(/['";\\]/g, '');
};

const sanitizeUserInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Hook for form validation with security features
 */
export const useSecureValidation = <T>(schema: ZodSchema<T>) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (data: unknown): Promise<ValidationResult<T>> => {
    setIsValidating(true);
    
    try {
      // Log validation attempt
      auditLogService.logUserAction('form_validation', {
        fields: Object.keys(data as Record<string, unknown>)
      });

      const result = schema.parse(data) as T;
      setErrors({});  // Clear errors on success
      return { success: true, data: result };

    } catch (error) {
      if (error instanceof ValidationError) {
        const errorMap = error.fieldErrors ? 
          Object.entries(error.fieldErrors).reduce((acc: Record<string, string>, [field, messages]) => {
            acc[field] = messages[0] || 'Validation error';
            return acc;
          }, {}) : {};
        
        setErrors(errorMap);

        // Log validation failure
        auditLogService.logSecurityEvent('validation_failed', {
          errors: errorMap,
          fieldCount: Object.keys(data as Record<string, unknown>).length
        }, 'low');

        return { success: false, error };
      }
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  return {
    errors,
    isValidating,
    validate,
    clearErrors,
    setFieldError,
    hasErrors: Object.keys(errors).length > 0
  };
};

/**
 * Hook for authentication state management
 * @deprecated Use useAuth from '@/auth/hooks' instead
 */
export const useAuthLegacy = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = authTokenService.getAccessToken();
    const payload = authTokenService.getTokenPayload();
    
    setIsAuthenticated(!!token);
    setUser(payload);
    setIsLoading(false);

    // Subscribe to token changes
    const callbackId = 'auth_hook';
    authTokenService.onTokenChange(callbackId, (newToken) => {
      const newPayload = newToken ? authTokenService.getTokenPayload() : null;
      setIsAuthenticated(!!newToken);
      setUser(newPayload);
    });

    return () => {
      authTokenService.offTokenChange(callbackId);
    };
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      auditLogService.logAuthentication('login_attempt', true, {
        email: credentials.email
      });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const tokenPair = await response.json();
      authTokenService.setTokens(tokenPair);

      auditLogService.logAuthentication('login_success', true, {
        email: credentials.email
      });

      return true;
    } catch (error) {
      auditLogService.logAuthentication('login_failed', false, {
        email: credentials.email,
        error: (error as Error).message
      });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    auditLogService.logAuthentication('logout', true, {
      userId: user?.userId
    });
    
    authTokenService.clearTokens();
  }, [user]);

  const hasPermission = useCallback((permission: string): boolean => {
    return authTokenService.hasPermission(permission);
  }, []);

  const hasRole = useCallback((role: string): boolean => {
    return authTokenService.hasRole(role);
  }, []);

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole
  };
};

/**
 * Hook for rate limiting
 */
export const useRateLimit = (endpoint: string, config?: Partial<RateLimitConfig>) => {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const checkRateLimit = useCallback((): RateLimitStatus => {
    const currentStatus = rateLimitService.checkRateLimit(endpoint, config);
    setStatus(currentStatus);
    setIsBlocked(!currentStatus.allowed);

    if (!currentStatus.allowed) {
      auditLogService.logSecurityEvent('rate_limit_exceeded', {
        endpoint,
        remaining: currentStatus.remaining,
        retryAfter: currentStatus.retryAfter
      }, 'medium');
    }

    return currentStatus;
  }, [endpoint, config]);

  const executeWithRateLimit = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    const rateLimitStatus = checkRateLimit();
    
    if (!rateLimitStatus.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${rateLimitStatus.retryAfter} seconds.`);
    }

    try {
      const result = await operation();
      rateLimitService.recordRequest(endpoint);
      return result;
    } catch (error) {
      auditLogService.logError(error as Error, 'rate_limited_operation', {
        endpoint
      });
      throw error;
    }
  }, [endpoint, checkRateLimit]);

  useEffect(() => {
    checkRateLimit();
  }, [checkRateLimit]);

  return {
    status,
    isBlocked,
    checkRateLimit,
    executeWithRateLimit
  };
};

/**
 * Hook for secure API requests
 */
export const useSecureApi = () => {
  const makeSecureRequest = useCallback(async (
    url: string,
    options: RequestInit = {},
    rateLimitConfig?: Partial<RateLimitConfig>
  ) => {
    // Check rate limit
    const rateLimitStatus = rateLimitService.checkRateLimit(url, rateLimitConfig);
    if (!rateLimitStatus.allowed) {
      const error = new Error(`Rate limit exceeded for ${url}`);
      auditLogService.logSecurityEvent('rate_limit_violation', {
        url,
        retryAfter: rateLimitStatus.retryAfter
      }, 'medium');
      throw error;
    }

    // Add authentication headers
    const authHeaders = authTokenService.getAuthHeader();
    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers
    };

    // Add CSRF protection
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const responseTime = Date.now() - startTime;
      
      // Log API request
      auditLogService.logApiRequest(url, options.method || 'GET', response.ok, {
        statusCode: response.status,
        responseTime
      });

      // Record successful request for rate limiting
      rateLimitService.recordRequest(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      auditLogService.logError(error as Error, 'secure_api_request', {
        url,
        method: options.method || 'GET'
      });
      throw error;
    }
  }, []);

  return { makeSecureRequest };
};

/**
 * Hook for input sanitization
 */
export const useInputSanitization = () => {
  const sanitizeInput = useCallback((input: string, type: 'html' | 'sql' | 'user' = 'user'): string => {
    auditLogService.logUserAction('input_sanitization', {
      type,
      inputLength: input.length
    });

    switch (type) {
      case 'html':
        return sanitizeHtml(input);
      case 'sql':
        return sanitizeSql(input);
      case 'user':
      default:
        return sanitizeUserInput(input);
    }
  }, []);

  const sanitizeObject = useCallback((obj: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }, [sanitizeInput]);

  return {
    sanitizeInput,
    sanitizeObject
  };
};

/**
 * Hook for security monitoring
 */
export const useSecurityMonitoring = () => {
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    const updateEvents = () => {
      const summary = auditLogService.getSecuritySummary();
      setSecurityEvents(summary.recentEvents);
    };

    updateEvents();
    intervalRef.current = setInterval(updateEvents, 30000); // Update every 30 seconds
  }, [isMonitoring]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [isMonitoring]);

  const getSecuritySummary = useCallback(() => {
    return auditLogService.getSecuritySummary();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    securityEvents,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getSecuritySummary
  };
};