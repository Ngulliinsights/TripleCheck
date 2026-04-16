/**
 * Error Feedback Components
 * User-friendly error messages and recovery actions
 */

import React from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

// ============================================================================
// Type Definitions
// ============================================================================

interface ErrorMessageProps {
  readonly title?: string;
  readonly message: string;
  readonly type?: "error" | "warning" | "info";
  readonly actions?: ReadonlyArray<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  }>;
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

// ============================================================================
// Constants
// ============================================================================

const TYPE_STYLES = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
} as const;

const ICON_COLORS = {
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
} as const;

// ============================================================================
// Error Message Component
// ============================================================================

export const ErrorMessage = React.memo<ErrorMessageProps>(
  ({ title, message, type = "error", actions = [], className = "" }) => {
    return (
      <Alert className={`${TYPE_STYLES[type]} ${className}`}>
        <AlertTriangle className={`h-4 w-4 ${ICON_COLORS[type]}`} />
        <AlertDescription>
          <div className="flex flex-col gap-2">
            {title && <p className="font-medium">{title}</p>}
            <p>{message}</p>
            {actions.length > 0 && (
              <div className="flex gap-2 mt-2">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    onClick={action.onClick}
                    className="h-auto py-1 px-2"
                    {...(action.variant && { "data-variant": action.variant })}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }
);

ErrorMessage.displayName = "ErrorMessage";

// ============================================================================
// Network Error Component
// ============================================================================

export const NetworkError = React.memo<NetworkErrorProps>(
  ({ isOnline, onRetry, className = "" }) => {
    if (isOnline) return null;

    const actions = React.useMemo(
      () => (onRetry ? [{ label: "Retry", onClick: onRetry }] : []),
      [onRetry]
    );

    return (
      <ErrorMessage
        title="Connection Lost"
        message="You're currently offline. Please check your internet connection."
        type="warning"
        actions={actions}
        className={className}
      />
    );
  }
);

NetworkError.displayName = "NetworkError";

// ============================================================================
// API Error Component
// ============================================================================

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const err = error as any;
    
    if (err.response?.status === 404) {
      return "The requested resource was not found.";
    }
    if (err.response?.status === 500) {
      return "Server error. Please try again later.";
    }
    if (err.response?.status === 403) {
      return "You don't have permission to access this resource.";
    }
    if (err.message) {
      return err.message;
    }
  }
  
  return "An unexpected error occurred.";
};

export const ApiError = React.memo<ApiErrorProps>(
  ({ error, onRetry, onGoHome, className = "" }) => {
    const actions = React.useMemo(() => {
      const actionList = [];
      if (onRetry) {
        actionList.push({ label: "Try Again", onClick: onRetry });
      }
      if (onGoHome) {
        actionList.push({
          label: "Go Home",
          onClick: onGoHome,
          variant: "outline" as const,
        });
      }
      return actionList;
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
  }
);

ApiError.displayName = "ApiError";

// ============================================================================
// Form Error Component
// ============================================================================

export const FormError = React.memo<FormErrorProps>(
  ({ errors, generalError, onClear, className = "" }) => {
    const hasErrors = Object.keys(errors).length > 0 || generalError;

    const clearAction = React.useMemo(
      () => (onClear ? [{ label: "Clear", onClick: onClear }] : []),
      [onClear]
    );

    if (!hasErrors) return null;

    return (
      <div className={`space-y-2 ${className}`}>
        {generalError && (
          <ErrorMessage
            message={generalError}
            type="error"
            actions={clearAction}
          />
        )}
        {Object.entries(errors).map(([field, message]) => (
          <ErrorMessage
            key={field}
            title={`${field.charAt(0).toUpperCase() + field.slice(1)} Error`}
            message={message}
            type="error"
          />
        ))}
      </div>
    );
  }
);

FormError.displayName = "FormError";

// ============================================================================
// Error Details Component
// ============================================================================

export const ErrorDetails = React.memo<ErrorDetailsProps>(
  ({ error, errorId, showDetails = false, onCopyDetails, className = "" }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = React.useCallback(() => {
      const details = {
        message: error.message,
        stack: error.stack,
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
        .catch((err) => {
          console.error("Failed to copy error details:", err);
        });
    }, [error, errorId, onCopyDetails]);

    const currentTime = React.useMemo(
      () => new Date().toLocaleString(),
      [showDetails]
    );

    if (!showDetails) return null;

    return (
      <Card className={`border-red-200 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-red-800 flex items-center justify-between">
            Error Details
            <Button
              size="sm"
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
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-medium">Message:</span>
              <p className="text-gray-600 mt-1 break-words">{error.message}</p>
            </div>
            {errorId && (
              <div>
                <span className="font-medium">Error ID:</span>
                <Badge className="ml-2 text-xs border border-gray-300">
                  {errorId}
                </Badge>
              </div>
            )}
            <div>
              <span className="font-medium">Time:</span>
              <p className="text-gray-600 mt-1">{currentTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ErrorDetails.displayName = "ErrorDetails";