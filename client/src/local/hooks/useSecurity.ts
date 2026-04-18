/**
 * Security Hooks
 * Form validation, authentication, rate limiting, input sanitization, and audit monitoring.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { ZodSchema } from 'zod'

import { ValidationError }  from '../error-handling/errors/validation-error'
import { authTokenService } from '../services/AuthTokenService'
import { rateLimitService, RateLimitConfig, RateLimitStatus } from '../services/RateLimitService'
import { auditLogService }  from '../services/AuditLogService'

// ---------------------------------------------------------------------------
// Sanitization helpers (inline to avoid server-only imports)
// ---------------------------------------------------------------------------

const sanitizers = {
  html: (s: string) => s.replace(/<[^>]*>/g, ''),
  sql:  (s: string) => s.replace(/['";\\]/g, ''),
  user: (s: string) => s.trim().replace(/[<>]/g, ''),
} as const;

// ---------------------------------------------------------------------------
// useSecureValidation
// ---------------------------------------------------------------------------

interface ValidationResult<T> {
  success: boolean;
  data?:   T;
  error?:  ValidationError;
}

export function useSecureValidation<T>(schema: ZodSchema<T>) {
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (data: unknown): Promise<ValidationResult<T>> => {
    setIsValidating(true);
    try {
      auditLogService.logUserAction('form_validation', {
        fields: Object.keys(data as Record<string, unknown>),
      });
      const result = schema.parse(data) as T;
      setErrors({});
      return { success: true, data: result };
    } catch (err) {
      if (err instanceof ValidationError) {
        const map = err.fieldErrors
          ? Object.entries(err.fieldErrors).reduce<Record<string, string>>(
              (acc, [field, msgs]) => { acc[field] = msgs[0] ?? 'Validation error'; return acc; },
              {},
            )
          : {};
        setErrors(map);
        auditLogService.logSecurityEvent('validation_failed', { errors: map }, 'low');
        return { success: false, error: err };
      }
      throw err;
    } finally {
      setIsValidating(false);
    }
  }, [schema]);

  const clearErrors    = useCallback(() => setErrors({}), []);
  const setFieldError  = useCallback(
    (field: string, msg: string) => setErrors((prev) => ({ ...prev, [field]: msg })),
    [],
  );

  return { errors, isValidating, validate, clearErrors, setFieldError, hasErrors: Object.keys(errors).length > 0 };
}

// ---------------------------------------------------------------------------
// useAuthLegacy  (use useAuth from '@/auth/hooks' for new code)
// ---------------------------------------------------------------------------

/** @deprecated Prefer useAuth from '@/auth/hooks' */
export function useAuthLegacy() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user,            setUser]            = useState<unknown>(null);
  const [isLoading,       setIsLoading]       = useState(true);

  useEffect(() => {
    setIsAuthenticated(!!authTokenService.getAccessToken());
    setUser(authTokenService.getTokenPayload());
    setIsLoading(false);

    const id = 'auth_hook';
    authTokenService.onTokenChange(id, (token) => {
      setIsAuthenticated(!!token);
      setUser(token ? authTokenService.getTokenPayload() : null);
    });
    return () => authTokenService.offTokenChange(id);
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    auditLogService.logAuthentication('login_attempt', true, { email: credentials.email });
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(credentials),
    });
    if (!res.ok) {
      auditLogService.logAuthentication('login_failed', false, { email: credentials.email });
      throw new Error('Login failed');
    }
    authTokenService.setTokens(await res.json());
    auditLogService.logAuthentication('login_success', true, { email: credentials.email });
    return true;
  }, []);

  const logout = useCallback(() => {
    auditLogService.logAuthentication('logout', true, { userId: (user as Record<string, unknown>)?.['userId'] });
    authTokenService.clearTokens();
  }, [user]);

  const hasPermission = useCallback((p: string) => authTokenService.hasPermission(p), []);
  const hasRole       = useCallback((r: string) => authTokenService.hasRole(r),       []);

  return { isAuthenticated, user, isLoading, login, logout, hasPermission, hasRole };
}

// ---------------------------------------------------------------------------
// useRateLimit
// ---------------------------------------------------------------------------

export function useRateLimit(endpoint: string, config?: Partial<RateLimitConfig>) {
  const [status,    setStatus]    = useState<RateLimitStatus | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const check = useCallback((): RateLimitStatus => {
    const s = rateLimitService.checkRateLimit(endpoint, config);
    setStatus(s);
    setIsBlocked(!s.allowed);
    if (!s.allowed)
      auditLogService.logSecurityEvent('rate_limit_exceeded', { endpoint, retryAfter: s.retryAfter }, 'medium');
    return s;
  }, [endpoint, config]);

  const executeWithRateLimit = useCallback(async <T>(op: () => Promise<T>): Promise<T> => {
    const s = check();
    if (!s.allowed) throw new Error(`Rate limit exceeded. Retry in ${s.retryAfter}s.`);
    try {
      const result = await op();
      rateLimitService.recordRequest(endpoint);
      return result;
    } catch (err) {
      auditLogService.logError(err as Error, 'rate_limited_operation', { endpoint });
      throw err;
    }
  }, [endpoint, check]);

  useEffect(() => { check(); }, [check]);

  return { status, isBlocked, checkRateLimit: check, executeWithRateLimit };
}

// ---------------------------------------------------------------------------
// useSecureApi
// ---------------------------------------------------------------------------

export function useSecureApi() {
  const makeSecureRequest = useCallback(async (
    url:               string,
    options:           RequestInit = {},
    rateLimitConfig?:  Partial<RateLimitConfig>,
  ) => {
    const s = rateLimitService.checkRateLimit(url, rateLimitConfig);
    if (!s.allowed) {
      auditLogService.logSecurityEvent('rate_limit_violation', { url, retryAfter: s.retryAfter }, 'medium');
      throw new Error(`Rate limit exceeded for ${url}`);
    }

    const authHeaders = authTokenService.getAuthHeader();
    const csrfToken   = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers as Record<string, string>),
    };
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    const t0 = Date.now();
    try {
      const res = await fetch(url, { ...options, headers });
      const ms  = Date.now() - t0;
      auditLogService.logApiRequest(url, options.method ?? 'GET', res.ok, { statusCode: res.status, responseTime: ms });
      rateLimitService.recordRequest(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res;
    } catch (err) {
      auditLogService.logError(err as Error, 'secure_api_request', { url, method: options.method ?? 'GET' });
      throw err;
    }
  }, []);

  return { makeSecureRequest };
}

// ---------------------------------------------------------------------------
// useInputSanitization
// ---------------------------------------------------------------------------

export function useInputSanitization() {
  const sanitizeInput = useCallback((
    input: string,
    type:  keyof typeof sanitizers = 'user',
  ): string => {
    auditLogService.logUserAction('input_sanitization', { type, inputLength: input.length });
    return sanitizers[type](input);
  }, []);

  const sanitizeObject = useCallback(
    (obj: Record<string, unknown>): Record<string, unknown> => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k] = typeof v === 'string'
          ? sanitizeInput(v)
          : typeof v === 'object' && v !== null
          ? sanitizeObject(v as Record<string, unknown>)
          : v;
      }
      return out;
    },
    [sanitizeInput],
  );

  return { sanitizeInput, sanitizeObject };
}

// ---------------------------------------------------------------------------
// useSecurityMonitoring
// ---------------------------------------------------------------------------

export function useSecurityMonitoring() {
  const [securityEvents, setSecurityEvents] = useState<unknown[]>([]);
  const [isMonitoring,   setIsMonitoring]   = useState(false);
  const intervalRef                         = useRef<ReturnType<typeof setInterval>>();

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    const update = () => setSecurityEvents(auditLogService.getSecuritySummary().recentEvents);
    update();
    intervalRef.current = setInterval(update, 30_000);
    setIsMonitoring(true);
  }, [isMonitoring]);

  const stopMonitoring = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsMonitoring(false);
  }, []);

  const getSecuritySummary = useCallback(() => auditLogService.getSecuritySummary(), []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { securityEvents, isMonitoring, startMonitoring, stopMonitoring, getSecuritySummary };
}