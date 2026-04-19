/**
 * Loading States & Indicators
 *
 * Fixes / improvements applied:
 * - `NetworkStatus`: the `null` branch of the ternary inside `AlertDescription`
 *   caused TypeScript to complain in strict mode (ReactNode doesn't allow null
 *   inside JSX expression slots in some configs). Replaced with a short-circuit.
 * - `AsyncOperationStatus`: early returns were fine but the component re-rendered
 *   unnecessarily because the status check happened after all hooks. No hooks are
 *   used, so early returns are valid — added a quick-exit before the status chain.
 * - `useLoadingState`: `setLoadingError` called both `setIsLoading` and `setError`
 *   in two separate state updates, causing two renders. Merged into one `useReducer`
 *   to guarantee atomic updates.
 * - `PageLoading` skeleton: `Array.from` key is index — acceptable here as the
 *   list is static and never reordered; left as-is with a comment.
 * - Minor: aria attributes added to dynamic status indicators.
 */

import React from "react";
import {
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";

// ---------------------------------------------------------------------------
// LoadingSpinner
// ---------------------------------------------------------------------------

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SPINNER_SIZES = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" } as const;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => (
  <Loader2
    className={`animate-spin ${SPINNER_SIZES[size]} ${className}`}
    aria-label="Loading"
    role="status"
  />
);

// ---------------------------------------------------------------------------
// LoadingOverlay
// ---------------------------------------------------------------------------

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = "Loading…",
  className = "",
}) => (
  <div className={`relative ${className}`}>
    {children}
    {isLoading && (
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
}

const SKELETON_VARIANTS = {
  text:        "h-4 rounded",
  rectangular: "rounded",
  circular:    "rounded-full",
} as const;

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "text",
  width,
  height,
}) => {
  const style: React.CSSProperties = {};
  if (width  !== undefined) style.width  = typeof width  === "number" ? `${width}px`  : width;
  if (height !== undefined) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`animate-pulse bg-gray-200 ${SKELETON_VARIANTS[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

// ---------------------------------------------------------------------------
// LoadingCard
// ---------------------------------------------------------------------------

interface LoadingCardProps {
  title?: string;
  description?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = "Loading",
  description = "Please wait while we load your content…",
  showProgress = false,
  progress = 0,
}) => (
  <Card className="w-full max-w-md mx-auto">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        {showProgress && (
          <div className="w-full">
            <Progress value={progress} className="w-full" aria-label={`${progress}% complete`} />
            <p className="text-xs text-gray-500 mt-1 text-center">{progress}% complete</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// NetworkStatus
//
// FIX: The previous implementation had a ternary with a `null` arm inside
// `AlertDescription`, which is fine at runtime but triggers TypeScript in
// strict mode. Replaced with a short-circuit expression.
// ---------------------------------------------------------------------------

interface NetworkStatusProps {
  isOnline: boolean;
  isConnected: boolean;
  onRetry?: () => void;
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  isOnline,
  isConnected,
  onRetry,
  className = "",
}) => {
  if (isOnline && isConnected) return null;

  const message = !isOnline
    ? "You are currently offline. Some features may not be available."
    : "Connection issues detected. Trying to reconnect…";

  return (
    <Alert className={`border-orange-200 bg-orange-50 ${className}`} role="status">
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi    className="h-4 w-4 text-orange-600" aria-hidden="true" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600"    aria-hidden="true" />
        )}
        <AlertDescription className="flex-1">{message}</AlertDescription>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="h-auto p-1">
            Retry
          </Button>
        )}
      </div>
    </Alert>
  );
};

// ---------------------------------------------------------------------------
// AsyncOperationStatus
// ---------------------------------------------------------------------------

interface AsyncOperationStatusProps {
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  successMessage?: string;
  loadingMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export const AsyncOperationStatus: React.FC<AsyncOperationStatusProps> = ({
  status,
  error,
  successMessage = "Operation completed successfully",
  loadingMessage = "Processing…",
  onRetry,
  className = "",
}) => {
  if (status === "idle") return null;

  if (status === "loading") {
    return (
      <div className={`flex items-center gap-2 text-blue-600 ${className}`} aria-live="polite">
        <LoadingSpinner size="sm" />
        <span className="text-sm">{loadingMessage}</span>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`} aria-live="polite">
        <CheckCircle className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm">{successMessage}</span>
      </div>
    );
  }

  // status === "error"
  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`} role="alert">
      <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
      <AlertDescription className="text-red-800 flex items-center justify-between">
        <span>{error ?? "An error occurred"}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-auto p-1 text-red-600 hover:text-red-800"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

// ---------------------------------------------------------------------------
// PageLoading
// ---------------------------------------------------------------------------

interface PageLoadingProps {
  message?: string;
  showSkeleton?: boolean;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = "Loading page…",
  showSkeleton = false,
}) => {
  if (showSkeleton) {
    return (
      <div className="space-y-4 p-6" aria-busy="true">
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        {/* Index keys are acceptable here — this list is static and never reordered */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingCard title="Loading" description={message} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// TimeoutError
// ---------------------------------------------------------------------------

interface TimeoutErrorProps {
  onRetry: () => void;
  timeout?: number;
  message?: string;
}

export const TimeoutError: React.FC<TimeoutErrorProps> = ({
  onRetry,
  timeout = 30,
  message = "The request is taking longer than expected",
}) => (
  <Alert className="border-yellow-200 bg-yellow-50" role="alert">
    <Clock className="h-4 w-4 text-yellow-600" aria-hidden="true" />
    <AlertDescription className="text-yellow-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{message}</p>
          <p className="text-sm mt-1">This usually takes less than {timeout} seconds.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-yellow-600 hover:text-yellow-800"
        >
          Try Again
        </Button>
      </div>
    </AlertDescription>
  </Alert>
);

// ---------------------------------------------------------------------------
// useLoadingState
//
// FIX: The original used two separate setState calls in `setLoadingError`,
// which caused two render cycles. Replaced with useReducer so state updates
// are always atomic (single render per transition).
// ---------------------------------------------------------------------------

type LoadingState = { isLoading: boolean; error: string | null };
type LoadingAction =
  | { type: "start" }
  | { type: "stop" }
  | { type: "error"; message: string }
  | { type: "clearError" };

function loadingReducer(state: LoadingState, action: LoadingAction): LoadingState {
  switch (action.type) {
    case "start":      return { isLoading: true,  error: null           };
    case "stop":       return { isLoading: false, error: state.error    };
    case "error":      return { isLoading: false, error: action.message };
    case "clearError": return { ...state,          error: null           };
    default:           return state;
  }
}

export const useLoadingState = (initialLoading = false) => {
  const [state, dispatch] = React.useReducer(loadingReducer, {
    isLoading: initialLoading,
    error: null,
  });

  const startLoading    = React.useCallback(() => dispatch({ type: "start" }),                           []);
  const stopLoading     = React.useCallback(() => dispatch({ type: "stop" }),                            []);
  const setLoadingError = React.useCallback((msg: string) => dispatch({ type: "error", message: msg }), []);
  const clearError      = React.useCallback(() => dispatch({ type: "clearError" }),                      []);

  return { ...state, startLoading, stopLoading, setLoadingError, clearError };
};