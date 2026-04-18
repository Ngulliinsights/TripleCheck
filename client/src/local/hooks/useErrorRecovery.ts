/**
 * Error Recovery Hook
 * Provides error handling and recovery mechanisms for components.
 */

import { useState, useCallback, useEffect, useRef } from 'react'

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onError?: (error: Error, attempt: number) => void;
  onSuccess?: () => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export interface ErrorRecoveryState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  lastAttempt: Date | null;
}

export const useErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onError,
    onSuccess,
    onMaxRetriesReached,
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
    lastAttempt: null,
  });

  // Refs to avoid stale closures in callbacks
  const retryCountRef = useRef(0);
  const isRetryingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Keep option callbacks fresh without breaking memoization
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);
  const onMaxRetriesReachedRef = useRef(onMaxRetriesReached);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onMaxRetriesReachedRef.current = onMaxRetriesReached; }, [onMaxRetriesReached]);

  const calculateDelay = useCallback(
    (attempt: number) =>
      exponentialBackoff
        ? Math.min(retryDelay * Math.pow(2, attempt), 30_000)
        : retryDelay,
    [retryDelay, exponentialBackoff]
  );

  const handleError = useCallback(
    (error: Error) => {
      // Read from ref — not state — to avoid stale closure
      retryCountRef.current += 1;
      const newCount = retryCountRef.current;
      const canRetry = newCount < maxRetries;

      setState({
        error,
        isRetrying: false,
        retryCount: newCount,
        canRetry,
        lastAttempt: new Date(),
      });

      onErrorRef.current?.(error, newCount);
      if (!canRetry) onMaxRetriesReachedRef.current?.(error);
    },
    [maxRetries]
  );

  const retry = useCallback(
    async (operation: () => Promise<unknown>) => {
      if (retryCountRef.current >= maxRetries || isRetryingRef.current) return;

      isRetryingRef.current = true;
      setState(prev => ({ ...prev, isRetrying: true }));

      try {
        await new Promise<void>(resolve => {
          retryTimeoutRef.current = setTimeout(
            resolve,
            calculateDelay(retryCountRef.current)
          );
        });

        const result = await operation();

        retryCountRef.current = 0;
        isRetryingRef.current = false;
        setState({
          error: null,
          isRetrying: false,
          retryCount: 0,
          canRetry: true,
          lastAttempt: new Date(),
        });

        onSuccessRef.current?.();
        return result;
      } catch (err) {
        isRetryingRef.current = false;
        setState(prev => ({ ...prev, isRetrying: false }));
        handleError(err as Error);
        throw err;
      }
    },
    [maxRetries, calculateDelay, handleError]
  );

  const reset = useCallback(() => {
    clearTimeout(retryTimeoutRef.current);
    retryCountRef.current = 0;
    isRetryingRef.current = false;
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true,
      lastAttempt: null,
    });
  }, []);

  const executeWithRetry = useCallback(
    async (operation: () => Promise<unknown>) => {
      try {
        const result = await operation();
        // Clear stale errors on a fresh success
        if (retryCountRef.current > 0) reset();
        return result;
      } catch (err) {
        handleError(err as Error);
        throw err;
      }
    },
    [reset, handleError]
  );

  useEffect(() => {
    return () => clearTimeout(retryTimeoutRef.current);
  }, []);

  return { ...state, handleError, retry, reset, executeWithRetry };
};

// ---------------------------------------------------------------------------

/**
 * Network error handling with offline detection.
 */
export const useNetworkErrorRecovery = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionQuality, setConnectionQuality] = useState<
    'good' | 'poor' | 'offline'
  >('good');

  const errorRecovery = useErrorRecovery({
    maxRetries: 5,
    retryDelay: 2_000,
    exponentialBackoff: true,
    onError: (error) => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
      } else if (
        error.message.includes('timeout') ||
        error.message.includes('network')
      ) {
        setConnectionQuality('poor');
      }
    },
  });

  // Stable refs so the event listener effect never needs to re-run
  const resetRef = useRef(errorRecovery.reset);
  useEffect(() => { resetRef.current = errorRecovery.reset; }, [errorRecovery.reset]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
      resetRef.current();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // stable — refs used internally

  const executeNetworkOperation = useCallback(
    async (operation: () => Promise<unknown>) => {
      if (!navigator.onLine) {
        throw new Error(
          'No internet connection. Please check your network and try again.'
        );
      }
      return errorRecovery.executeWithRetry(operation);
    },
    [errorRecovery]
  );

  return { ...errorRecovery, isOnline, connectionQuality, executeNetworkOperation };
};

// ---------------------------------------------------------------------------

/**
 * API error handling with HTTP status-aware retry logic.
 */
export const useApiErrorRecovery = () => {
  const errorRecovery = useErrorRecovery({
    maxRetries: 3,
    retryDelay: 1_000,
    exponentialBackoff: true,
  });

  const handleApiError = useCallback(
    (error: unknown) => {
      let message = 'An unexpected error occurred';
      let shouldRetry = true;

      // Type guard for axios-like errors
      const isAxiosError = (e: unknown): e is { response?: { status: number } } => 
        e !== null && typeof e === 'object' && 'response' in e;
      
      const isNetworkError = (e: unknown): e is { request?: unknown } =>
        e !== null && typeof e === 'object' && 'request' in e;

      if (isAxiosError(error)) {
        const { status } = error.response ?? {};
        switch (status) {
          case 400:
            message = 'Invalid request. Please check your input and try again.';
            shouldRetry = false;
            break;
          case 401:
            message = 'Authentication required. Please log in and try again.';
            shouldRetry = false;
            window.location.href = '/login';
            break;
          case 403:
            message = 'You do not have permission to perform this action.';
            shouldRetry = false;
            break;
          case 404:
            message = 'The requested resource was not found.';
            shouldRetry = false;
            break;
          case 429:
            message = 'Too many requests. Please wait a moment and try again.';
            shouldRetry = true;
            break;
          case 500:
            message = 'Server error. Please try again later.';
            shouldRetry = true;
            break;
          case 502:
          case 503:
          case 504:
            message = 'Service temporarily unavailable. Please try again later.';
            shouldRetry = true;
            break;
          default:
            message = `Request failed with status ${status}`;
            shouldRetry = status ? status >= 500 : true;
        }
      } else if (isNetworkError(error)) {
        message = 'Network error. Please check your connection and try again.';
      } else if (error instanceof Error) {
        message = error.message;
        shouldRetry = false;
      }

      const enhanced = Object.assign(new Error(message), {
        shouldRetry,
        originalError: error,
      });

      errorRecovery.handleError(enhanced);
    },
    [errorRecovery]
  );

  const executeApiCall = useCallback(
    async (apiCall: () => Promise<unknown>) => {
      try {
        return await errorRecovery.executeWithRetry(apiCall);
      } catch (err) {
        handleApiError(err);
      }
    },
    [errorRecovery, handleApiError]
  );

  return { ...errorRecovery, handleApiError, executeApiCall };
};

// ---------------------------------------------------------------------------

/**
 * Form submission error handling with per-field validation errors.
 */
export const useFormErrorRecovery = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errorRecovery = useErrorRecovery({
    maxRetries: 2,
    retryDelay: 1_000,
    exponentialBackoff: false,
  });

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setSubmitError(null);
    errorRecovery.reset();
  }, [errorRecovery]);

  const handleFormError = useCallback(
    (error: unknown) => {
      setSubmitError(null);
      setFieldErrors({});

      // Type guard for API response errors
      const isApiError = (e: unknown): e is { response?: { data?: { errors?: unknown; message?: unknown } } } =>
        e !== null && typeof e === 'object' && 'response' in e;

      if (isApiError(error) && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (typeof errors === 'object' && !Array.isArray(errors)) {
          setFieldErrors(errors as Record<string, string>);
        } else {
          setSubmitError('Please correct the errors and try again.');
        }
      } else if (isApiError(error) && error.response?.data?.message) {
        setSubmitError(error.response.data.message as string);
      } else {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to submit form. Please try again.';
        setSubmitError(message);
        errorRecovery.handleError(
          error instanceof Error ? error : new Error(message)
        );
      }
    },
    [errorRecovery]
  );

  const submitForm = useCallback(
    async (submitFunction: () => Promise<unknown>) => {
      clearErrors();
      try {
        return await errorRecovery.executeWithRetry(submitFunction);
      } catch (err) {
        handleFormError(err);
        throw err;
      }
    },
    [errorRecovery, clearErrors, handleFormError]
  );

  return {
    ...errorRecovery,
    fieldErrors,
    submitError,
    handleFormError,
    clearErrors,
    submitForm,
  };
};