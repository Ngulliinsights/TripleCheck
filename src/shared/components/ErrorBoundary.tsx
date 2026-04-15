/**
 * Error Boundary Components
 * Comprehensive error handling with fallback UI and recovery mechanisms
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'

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
  level?: 'component' | 'page' | 'global';
  showDetails?: boolean;
}

/**
 * Base Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    this.logError(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      console.error('Error Boundary caught an error:', errorData);
    } else {
      console.error('Error Boundary caught an error:', errorData);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    };

    // Create mailto link with error details
    const subject = encodeURIComponent(`Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error Details:
${JSON.stringify(errorReport, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on error level
      return this.renderErrorFallback();
    }

    return this.props.children;
  }

  private renderErrorFallback() {
    const { level = 'component', showDetails = false } = this.props;
    const { error, errorId } = this.state;

    if (level === 'component') {
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

    if (level === 'page') {
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

    // Global level error
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
              The application encountered an unexpected error. We apologize for the inconvenience.
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
              If this problem persists, please contact support with Error ID: {errorId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}

/**
 * Component-level Error Boundary
 */
export const ComponentErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="component" />
);

/**
 * Page-level Error Boundary
 */
export const PageErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="page" showDetails={process.env.NODE_ENV === 'development'} />
);

/**
 * Global Error Boundary
 */
export const GlobalErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="global" showDetails={process.env.NODE_ENV === 'development'} />
);

/**
 * Hook for programmatic error handling
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', errorData);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      console.error('Production error:', errorData);
    }
  }, []);

  return { handleError };
};