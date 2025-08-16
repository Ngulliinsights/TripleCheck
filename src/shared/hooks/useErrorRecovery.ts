/**
 * Error Recovery Hook
 * Provides error handling and recovery mechanisms for components
 */

import { useState, useCallback, useEffect, useRef } from 'react';

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
    onMaxRetriesReached
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
    lastAttempt: null
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const calculateDelay = useCallback((attempt: number) => {
    if (!exponentialBackoff) return retryDelay;
    return Math.min(retryDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
  }, [retryDelay, exponentialBackoff]);

  const handleError = useCallback((error: Error) => {
    const newRetryCount = state.retryCount + 1;
    const canRetry = newRetryCount < maxRetries;

    setState(prev => ({
      ...prev,
      error,
      retryCount: newRetryCount,
      canRetry,
      lastAttempt: new Date()
    }));

    onError?.(error, newRetryCount);

    if (!canRetry) {
      onMaxRetriesReached?.(error);
    }
  }, [state.retryCount, maxRetries, onError, onMaxRetriesReached]);

  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (!state.canRetry || state.isRetrying) {
      return;
    }

    setState(prev => ({ ...prev, isRetrying: true }));

    try {
      const delay = calculateDelay(state.retryCount);
      
      await new Promise(resolve => {
        retryTimeoutRef.current = setTimeout(resolve, delay);
      });

      const result = await operation();
      
      setState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: true,
        lastAttempt: new Date()
      });

      onSuccess?.();
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isRetrying: false }));
      handleError(error as Error);
      throw error;
    }
  }, [state.canRetry, state.isRetrying, state.retryCount, calculateDelay, handleError, onSuccess]);

  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true,
      lastAttempt: null
    });
  }, []);

  const executeWithRetry = useCallback(async (operation: () => Promise<any>) => {
    try {
      const result = await operation();
      
      if (state.error) {
        reset(); // Clear any previous errors on success
      }
      
      return result;
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [state.error, reset, handleError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    handleError,
    retry,
    reset,
    executeWithRetry
  };
};

/**
 * Hook for network error handling with offline detection
 */
export const useNetworkErrorRecovery = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  const errorRecovery = useErrorRecovery({
    maxRetries: 5,
    retryDelay: 2000,
    exponentialBackoff: true,
    onError: (error, attempt) => {
      // Adjust retry strategy based on network conditions
      if (!isOnline) {
        setConnectionQuality('offline');
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        setConnectionQuality('poor');
      }
    }
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
      errorRecovery.reset();
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
  }, [errorRecovery]);

  const executeNetworkOperation = useCallback(async (operation: () => Promise<any>) => {
    if (!isOnline) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    return errorRecovery.executeWithRetry(operation);
  }, [isOnline, errorRecovery]);

  return {
    ...errorRecovery,
    isOnline,
    connectionQuality,
    executeNetworkOperation
  };
};

/**
 * Hook for API error handling with specific error types
 */
export const useApiErrorRecovery = () => {
  const errorRecovery = useErrorRecovery({
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true
  });

  const handleApiError = useCallback((error: any) => {
    let errorMessage = 'An unexpected error occurred';
    let shouldRetry = true;

    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input and try again.';
          shouldRetry = false;
          break;
        case 401:
          errorMessage = 'Authentication required. Please log in and try again.';
          shouldRetry = false;
          // Redirect to login
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          shouldRetry = false;
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          shouldRetry = false;
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          shouldRetry = true;
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          shouldRetry = true;
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'Service temporarily unavailable. Please try again later.';
          shouldRetry = true;
          break;
        default:
          errorMessage = `Request failed with status ${status}`;
          shouldRetry = status >= 500;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection and try again.';
      shouldRetry = true;
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
      shouldRetry = false;
    }

    const enhancedError = new Error(errorMessage);
    (enhancedError as any).shouldRetry = shouldRetry;
    (enhancedError as any).originalError = error;

    if (shouldRetry) {
      errorRecovery.handleError(enhancedError);
    } else {
      errorRecovery.handleError(enhancedError);
      // Don't allow retries for client errors
      return { ...errorRecovery, canRetry: false };
    }

    return errorRecovery;
  }, [errorRecovery]);

  const executeApiCall = useCallback(async (apiCall: () => Promise<any>) => {
    try {
      return await errorRecovery.executeWithRetry(apiCall);
    } catch (error) {
      return handleApiError(error);
    }
  }, [errorRecovery, handleApiError]);

  return {
    ...errorRecovery,
    handleApiError,
    executeApiCall
  };
};

/**
 * Hook for form submission error handling
 */
export const useFormErrorRecovery = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errorRecovery = useErrorRecovery({
    maxRetries: 2,
    retryDelay: 1000,
    exponentialBackoff: false
  });

  const handleFormError = useCallback((error: any) => {
    setSubmitError(null);
    setFieldErrors({});

    if (error.response?.data?.errors) {
      // Handle validation errors
      const errors = error.response.data.errors;
      if (typeof errors === 'object') {
        setFieldErrors(errors);
      } else {
        setSubmitError('Please correct the errors and try again.');
      }
    } else if (error.response?.data?.message) {
      setSubmitError(error.response.data.message);
    } else {
      setSubmitError(error.message || 'Failed to submit form. Please try again.');
      errorRecovery.handleError(error);
    }
  }, [errorRecovery]);

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setSubmitError(null);
    errorRecovery.reset();
  }, [errorRecovery]);

  const submitForm = useCallback(async (submitFunction: () => Promise<any>) => {
    clearErrors();
    
    try {
      return await errorRecovery.executeWithRetry(submitFunction);
    } catch (error) {
      handleFormError(error);
      throw error;
    }
  }, [errorRecovery, clearErrors, handleFormError]);

  return {
    ...errorRecovery,
    fieldErrors,
    submitError,
    handleFormError,
    clearErrors,
    submitForm
  };
};