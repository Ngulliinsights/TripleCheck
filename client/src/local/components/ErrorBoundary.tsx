/**
 * Error Boundary Components
 *
 * Fixes applied:
 * - `substr()` (deprecated) → `substring()`
 * - `logError` converted from class arrow-field to a regular method
 *   (arrow fields on class instances skip the prototype chain and are
 *    not ideal for methods that never need to be detached from `this`)
 * - `useErrorHandler` callback deps corrected (empty array — the function
 *   has no reactive deps)
 * - Misc: `process.env.NODE_ENV` guard collapsed; redundant `else` branches
 *   after a `return` removed; email placeholder updated to a constant
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORT_EMAIL = "support@example.com";

const IS_DEV = process.env.NODE_ENV === "development";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: "component" | "page" | "global";
  showDetails?: boolean;
}

// ---------------------------------------------------------------------------
// ErrorBoundary
// ---------------------------------------------------------------------------

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorId: "" };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // FIX: `substr` is deprecated — use `substring`
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.logError(error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  // FIX: Regular method instead of class arrow-field.
  // Arrow fields are bound per-instance and skip the prototype, which bloats
  // memory when many instances exist and prevents subclass overrides.
  // This method is only ever called as `this.logError(...)` so no binding needed.
  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      level: this.props.level ?? "component",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // TODO: In production replace with your monitoring service (Sentry, Datadog, etc.)
    console.error("Error Boundary caught an error:", errorData);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: "" });
  };

  private handleReload = () => window.location.reload();

  private handleGoHome = () => { window.location.href = "/"; };

  private handleReportError = () => {
    const { errorId, error, errorInfo } = this.state;
    const report = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    };
    const subject = encodeURIComponent(`Error Report — ${errorId}`);
    const body = encodeURIComponent(
      `Error Details:\n${JSON.stringify(report, null, 2)}\n\nWhat I was doing:\n[describe here]`,
    );
    window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback)   return this.props.fallback;
    return this.renderErrorFallback();
  }

  private renderErrorFallback() {
    const { level = "component", showDetails = false } = this.props;
    const { error, errorId } = this.state;

    if (level === "component") {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Something went wrong with this component.
            <Button
              variant="ghost"
              size="sm"
              onClick={this.handleRetry}
              className="ml-2 h-auto p-1 text-red-600 hover:text-red-800"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (level === "page") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-800">Page Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                This page encountered an error and couldn't load properly.
              </p>

              {showDetails && error && (
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <p className="font-medium text-gray-800">Error Details:</p>
                  <p className="text-gray-600 mt-1">{error.message}</p>
                  <p className="text-xs text-gray-500 mt-2">Error ID: {errorId}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Global level
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Bug className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-800">Application Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-center">
              The application encountered an unexpected error. We apologise for the
              inconvenience.
            </p>

            {showDetails && error && (
              <div className="bg-gray-100 p-4 rounded text-sm">
                <p className="font-medium text-gray-800">Technical Details:</p>
                <p className="text-gray-600 mt-1">{error.message}</p>
                <p className="text-xs text-gray-500 mt-2">Error ID: {errorId}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button onClick={this.handleReload} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Application
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
              <Button onClick={this.handleReportError} variant="ghost" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Report This Error
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              If this problem persists, contact support with Error ID:{" "}
              <span className="font-mono">{errorId}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

export const ComponentErrorBoundary: React.FC<Omit<ErrorBoundaryProps, "level">> = (props) => (
  <ErrorBoundary {...props} level="component" />
);

export const PageErrorBoundary: React.FC<Omit<ErrorBoundaryProps, "level">> = (props) => (
  <ErrorBoundary {...props} level="page" showDetails={IS_DEV} />
);

export const GlobalErrorBoundary: React.FC<Omit<ErrorBoundaryProps, "level">> = (props) => (
  <ErrorBoundary {...props} level="global" showDetails={IS_DEV} />
);

// ---------------------------------------------------------------------------
// useErrorHandler hook
//
// FIX: The original hook used `React.useCallback` with an empty deps array,
// which was correct — but the body still referenced `process.env.NODE_ENV`
// at every call-site. Replaced with the module-level `IS_DEV` constant so
// the check is evaluated once at module load rather than per-call.
// ---------------------------------------------------------------------------

export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    // TODO: In production, pipe to your monitoring service
    console.error(IS_DEV ? "Error handled (dev):" : "Production error:", errorData);
  }, []); // no reactive deps — stable for the lifetime of the component

  return { handleError };
};