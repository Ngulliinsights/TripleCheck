/**
 * Unified Error Handling Hook for Compare Components
 *
 * Provides consistent error handling across all comparison functionality.
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
  /** Manually set a fully-formed CompareError (use `handleError` for raw unknowns). */
  setCompareError: (error: CompareError) => void;
  clearError: () => void;
  /** Accepts any thrown value and normalizes it into a CompareError. */
  handleError: (error: unknown, context?: string) => void;
}

export function useCompareError(): UseCompareErrorReturn {
  const [error, setError] = useState<CompareError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const setCompareError = useCallback((err: CompareError) => {
    setError(err);
  }, []);

  const handleError = useCallback((raw: unknown, context?: string) => {
    const message = raw instanceof Error ? raw.message : String(raw);

    setError({
      message,
      context,
      timestamp: new Date(),
      originalError: raw,
    });

    console.error(`Compare Error${context ? ` (${context})` : ''}:`, raw);
  }, []);

  return { error, setCompareError, clearError, handleError };
}