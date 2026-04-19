/**
 * Error Feedback Components
 *
 * Fixes applied:
 * - `currentTime` useMemo had `showDetails` in its dependency array, which is
 *   wrong: `showDetails` controls *visibility*, not the timestamp value.
 *   Replaced with a ref-stable `Date` captured at mount via `useState` init.
 * - Button `variant` was forwarded via a non-standard `data-variant` attribute
 *   instead of the actual `variant` prop — fixed.
 * - `actions` typed with explicit ButtonVariant union instead of a loose string.
 * - `getErrorMessage` uses a typed guard instead of `as any`.
 * - Minor: redundant `className = ""` defaults kept for backwards-compat.
 */

import React from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ButtonVariant = "default" | "outline" | "ghost";

interface ActionItem {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
}

interface ErrorMessageProps {
  readonly title?: string;
  readonly message: string;
  readonly type?: "error" | "warning" | "info";
  readonly actions?: ReadonlyArray<ActionItem>;
  readonly className?: string;
}

interface NetworkErrorProps {
  readonly isOnline: boolean;
  readonly onRetry?: () => void;
  readonly className?: string;
}

interface ApiErrorProps {
  readonly error: unknown;
  readonly onRetry?: () => void;
  readonly onGoHome?: () => void;
  readonly className?: string;
}

interface FormErrorProps {
  readonly errors: Record<string, string>;
  readonly generalError?: string;
  readonly onClear?: () => void;
  readonly className?: string;
}

interface ErrorDetailsProps {
  readonly error: Error;
  readonly errorId?: string;
  readonly showDetails?: boolean;
  readonly onCopyDetails?: () => void;
  readonly className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_STYLES = {
  error:   "border-red-200 bg-red-50 text-red-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  info:    "border-blue-200 bg-blue-50 text-blue-800",
} as const;

const ICON_COLORS = {
  error:   "text-red-600",
  warning: "text-yellow-600",
  info:    "text-blue-600",
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Narrows `unknown` error values to a human-readable string.
 * Uses a typed guard instead of casting to `any`.
 */
function getErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "An unexpected error occurred.";
  }

  // Shape expected from Axios / fetch-wrapper errors
  const err = error as {
    response?: { status?: number };
    message?: string;
  };

  switch (err.response?.status) {
    case 403: return "You don't have permission to access this resource.";
    case 404: return "The requested resource was not found.";
    case 500: return "Server error. Please try again later.";
  }

  return typeof err.message === "string" ? err.message : "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// ErrorMessage
// ---------------------------------------------------------------------------

export const ErrorMessage = React.memo<ErrorMessageProps>(
  ({ title, message, type = "error", actions = [], className = "" }) => (
    <Alert className={`${TYPE_STYLES[type]} ${className}`}>
      <AlertTriangle className={`h-4 w-4 ${ICON_COLORS[type]}`} aria-hidden="true" />
      <AlertDescription>
        <div className="flex flex-col gap-2">
          {title && <p className="font-medium">{title}</p>}
          <p>{message}</p>
          {actions.length > 0 && (
            <div className="flex gap-2 mt-2">
              {actions.map((action, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  // FIX: use the actual `variant` prop instead of data-variant
                  variant={action.variant ?? "default"}
                  onClick={action.onClick}
                  className="h-auto py-1 px-2"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  ),
);
ErrorMessage.displayName = "ErrorMessage";

// ---------------------------------------------------------------------------
// NetworkError
// ---------------------------------------------------------------------------

export const NetworkError = React.memo<NetworkErrorProps>(
  ({ isOnline, onRetry, className = "" }) => {
    const actions = React.useMemo<ActionItem[]>(
      () => (onRetry ? [{ label: "Retry", onClick: onRetry }] : []),
      [onRetry],
    );

    if (isOnline) return null;

    return (
      <ErrorMessage
        title="Connection Lost"
        message="You're currently offline. Please check your internet connection."
        type="warning"
        actions={actions}
        className={className}
      />
    );
  },
);
NetworkError.displayName = "NetworkError";

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------

export const ApiError = React.memo<ApiErrorProps>(
  ({ error, onRetry, onGoHome, className = "" }) => {
    const actions = React.useMemo<ActionItem[]>(() => {
      const list: ActionItem[] = [];
      if (onRetry)  list.push({ label: "Try Again", onClick: onRetry });
      if (onGoHome) list.push({ label: "Go Home",   onClick: onGoHome, variant: "outline" });
      return list;
    }, [onRetry, onGoHome]);

    const errorMessage = React.useMemo(() => getErrorMessage(error), [error]);

    return (
      <ErrorMessage
        title="Request Failed"
        message={errorMessage}
        type="error"
        actions={actions}
        className={className}
      />
    );
  },
);
ApiError.displayName = "ApiError";

// ---------------------------------------------------------------------------
// FormError
// ---------------------------------------------------------------------------

export const FormError = React.memo<FormErrorProps>(
  ({ errors, generalError, onClear, className = "" }) => {
    const clearAction = React.useMemo<ActionItem[]>(
      () => (onClear ? [{ label: "Clear", onClick: onClear }] : []),
      [onClear],
    );

    const hasErrors = Object.keys(errors).length > 0 || Boolean(generalError);
    if (!hasErrors) return null;

    return (
      <div className={`space-y-2 ${className}`}>
        {generalError && (
          <ErrorMessage message={generalError} type="error" actions={clearAction} />
        )}
        {Object.entries(errors).map(([field, message]) => (
          <ErrorMessage
            key={field}
            title={`${field.charAt(0).toUpperCase()}${field.slice(1)} Error`}
            message={message}
            type="error"
          />
        ))}
      </div>
    );
  },
);
FormError.displayName = "FormError";

// ---------------------------------------------------------------------------
// ErrorDetails
//
// FIX: The original component used:
//   const currentTime = React.useMemo(() => new Date().toLocaleString(), [showDetails]);
//
// `showDetails` only determines whether the component renders — it does NOT
// change what time it is. Using it as a dependency meant the timestamp would
// reset whenever `showDetails` toggled, which is wrong.
//
// Fix: capture the mount time once with `useState` lazy initialiser.
// The timestamp is then stable for the lifetime of the component instance,
// which is the correct semantic (when did this error detail panel appear?).
// ---------------------------------------------------------------------------

export const ErrorDetails = React.memo<ErrorDetailsProps>(
  ({ error, errorId, showDetails = false, onCopyDetails, className = "" }) => {
    // Stable timestamp — captured once at mount
    const [mountTime] = React.useState(() => new Date().toLocaleString());
    const [copied, setCopied] = React.useState(false);

    const handleCopy = React.useCallback(() => {
      const details = {
        message: error.message,
        stack:   error.stack,
        errorId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      navigator.clipboard
        .writeText(JSON.stringify(details, null, 2))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          onCopyDetails?.();
        })
        .catch((err) => console.error("Failed to copy error details:", err));
    }, [error, errorId, onCopyDetails]);

    if (!showDetails) return null;

    return (
      <Card className={`border-red-200 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-red-800 flex items-center justify-between">
            Error Details
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-auto p-1"
              aria-label={copied ? "Copied to clipboard" : "Copy error details"}
            >
              {copied ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Copy className="h-3 w-3" aria-hidden="true" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <dl className="space-y-2 text-xs">
            <div>
              <dt className="font-medium">Message:</dt>
              <dd className="text-gray-600 mt-1 break-words">{error.message}</dd>
            </div>
            {errorId && (
              <div>
                <dt className="font-medium inline">Error ID:</dt>
                <Badge className="ml-2 text-xs border border-gray-300">{errorId}</Badge>
              </div>
            )}
            <div>
              <dt className="font-medium">Time:</dt>
              <dd className="text-gray-600 mt-1">{mountTime}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    );
  },
);
ErrorDetails.displayName = "ErrorDetails";