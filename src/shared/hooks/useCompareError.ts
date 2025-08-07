/**
 * Unified Compare Error Handling Hook
 * 
 * Provides consistent error handling across all compare components
 */

import { useState, useCallback } from "react";

export interface CompareError {
  message: string;
  code?: string;
  context?: string;
}

export interface UseCompareErrorReturn {
  error: CompareError | null;
  setError: (error: CompareError | string | null) => void;
  clearError: () => void;
  hasError: boolean;
  handleError: (error: unknown, context?: string) => void;
}

export const useCompareError = (): UseCompareErrorReturn => {
  const [error, setErrorState] = useState<CompareError | null>(null);

  const setError = useCallback((error: CompareError | string | null) => {
    if (error === null) {
      setErrorState(null);
    } else if (typeof error === "string") {
      setErrorState({ message: error });
    } else {
      setErrorState(error);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    let message = "An unexpected error occurred";
    let code: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      code = error.name;
    } else if (typeof error === "string") {
      message = error;
    } else if (error && typeof error === "object" && "message" in error) {
      message = String(error.message);
    }

    setErrorState({
      message,
      code,
      context,
    });

    // Log error for debugging in development
    if (process.env.NODE_ENV === "development") {
      console.error("Compare error:", { error, context });
    }
  }, []);

  return {
    error,
    setError,
    clearError,
    hasError: error !== null,
    handleError,
  };
};