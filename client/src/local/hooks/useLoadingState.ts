/**
 * useLoadingState Hook
 *
 * Manages loading and error state for async operations with atomic state updates.
 * Uses useReducer to ensure state transitions are atomic (single render per transition).
 *
 * Usage:
 * ```tsx
 * const { isLoading, error, startLoading, stopLoading, setLoadingError, clearError } = useLoadingState();
 *
 * const handleFetch = async () => {
 *   startLoading();
 *   try {
 *     const data = await fetchData();
 *     stopLoading();
 *     // Process data
 *   } catch (err) {
 *     setLoadingError(err.message);
 *   }
 * };
 * ```
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LoadingState = { isLoading: boolean; error: string | null };

type LoadingAction =
  | { type: "start" }
  | { type: "stop" }
  | { type: "error"; message: string }
  | { type: "clearError" };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function loadingReducer(state: LoadingState, action: LoadingAction): LoadingState {
  switch (action.type) {
    case "start":
      return { isLoading: true, error: null };
    case "stop":
      return { isLoading: false, error: state.error };
    case "error":
      return { isLoading: false, error: action.message };
    case "clearError":
      return { ...state, error: null };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useLoadingState = (initialLoading = false) => {
  const [state, dispatch] = React.useReducer(loadingReducer, {
    isLoading: initialLoading,
    error: null,
  });

  const startLoading = React.useCallback(() => dispatch({ type: "start" }), []);
  const stopLoading = React.useCallback(() => dispatch({ type: "stop" }), []);
  const setLoadingError = React.useCallback(
    (msg: string) => dispatch({ type: "error", message: msg }),
    []
  );
  const clearError = React.useCallback(() => dispatch({ type: "clearError" }), []);

  return {
    ...state,
    startLoading,
    stopLoading,
    setLoadingError,
    clearError,
  };
};

export type { LoadingState };
