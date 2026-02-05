/**
 * Unified Error Handling Hook for Compare Components
 * 
 * Provides consistent error handling across all comparison functionality
 */

import { useState, useCallback } from 'react'

export interface CompareError {
  message: string;
  context?: string;
  timestamp: Date;
  originalError?: unknown;
}

export interface UseCompareErrorReturn {
  error: CompareError | null;
  setError: (error: CompareError) => void;
  clearError: () => void;
  handleError: (error: unknown, context?: string) => void;
}

export function useCompareError(): UseCompareErrorReturn {
  const [error, setError] = useState<CompareError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    setError({
      message: errorMessage,
      context,
      timestamp: new Date(),
      originalError: error,
    });

    // Log error for debugging
    console.error(`Compare Error${context ? ` (${context})` : ''}:`, error);
  }, []);

  return {
    error,
    setError,
    clearError,
    handleError,
  };
}