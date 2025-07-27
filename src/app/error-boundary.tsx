import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "../shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../shared/components/ui/card";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  level?: 'page' | 'component' | 'route';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  public override state: State = {
    hasError: false,
    errorId: '',
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Enhanced error detection for React 18 concurrent features
    const isReactConcurrentError = error.message.includes('concurrent') || 
                                   error.message.includes('Suspense') ||
                                   error.message.includes('startTransition');
    
    // Log concurrent-specific errors for debugging
    if (isReactConcurrentError) {
      console.warn('React 18 concurrent feature error detected:', error.message);
    }
    
    return { 
      hasError: true, 
      error,
      errorId,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error logging with more context
    const errorDetails = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId,
        level: this.props.level || 'component',
      },
    };

    // Log to console with structured data
    console.group('🚨 ErrorBoundary caught an error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Full Context:', errorDetails);
    console.groupEnd();

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToMonitoring(errorDetails);
    }

    // Update state with error info
    this.setState({ errorInfo });
  }

  private sendErrorToMonitoring = (errorDetails: any) => {
    try {
      // Send to error monitoring service (e.g., Sentry, LogRocket, etc.)
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails),
      }).catch(error => {
        console.warn('Failed to send error to monitoring service:', error);
      });
    } catch (error) {
      console.warn('Error monitoring service unavailable:', error);
    }
  };

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    // Prevent infinite retry loops
    if (newRetryCount > 3) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Exponential backoff: 1s, 2s, 4s delays
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 4000);
    
    console.log(`Retrying in ${delay}ms (attempt ${newRetryCount}/3)`);
    
    this.retryTimeoutId = setTimeout(() => {
      // Force a clean state reset for React 18 concurrent features
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        retryCount: newRetryCount,
        errorId: '', // Reset error ID for fresh start
      });
      
      // Force a re-render by triggering a state update
      setTimeout(() => {
        this.forceUpdate();
      }, 50);
    }, delay);
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.handleGoHome();
    }
  };

  private getErrorMessage = (error?: Error): string => {
    if (!error) return 'An unexpected error occurred';

    // Provide user-friendly messages for common errors
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Failed to load page resources. This might be due to a network issue or an app update.';
    }
    
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('Permission denied') || error.message.includes('Unauthorized')) {
      return 'You don\'t have permission to access this resource. Please log in and try again.';
    }
    
    if (error.message.includes('Not found') || error.message.includes('404')) {
      return 'The requested page or resource could not be found.';
    }

    if (error.name === 'TypeError' && error.message.includes('Cannot read prop')) {
      return 'There was an issue loading the page data. Please try refreshing the page.';
    }

    // Default to a generic message for unknown errors
    return 'Something went wrong while loading this page.';
  };

  private getErrorSuggestions = (error?: Error): string[] => {
    if (!error) return ['Try refreshing the page', 'Check your internet connection'];

    const suggestions: string[] = [];

    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      suggestions.push('Refresh the page to load the latest version');
      suggestions.push('Clear your browser cache');
      suggestions.push('Check your internet connection');
    } else if (error.message.includes('Network Error')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
      suggestions.push('Contact support if the issue persists');
    } else if (error.message.includes('Permission denied')) {
      suggestions.push('Log in to your account');
      suggestions.push('Contact support if you believe this is an error');
    } else {
      suggestions.push('Try refreshing the page');
      suggestions.push('Go back and try a different action');
      suggestions.push('Contact support if the problem continues');
    }

    return suggestions;
  };

  public override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.getErrorMessage(this.state.error);
      const suggestions = this.getErrorSuggestions(this.state.error);
      const showDetails = this.props.showErrorDetails ?? (process.env.NODE_ENV === 'development');
      const isRouteLevel = this.props.level === 'route';

      return (
        <div className={`flex items-center justify-center ${isRouteLevel ? 'min-h-screen' : 'min-h-[400px]'} p-4`}>
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>

              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Here's what you can try:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showDetails && this.state.error && (
                <details className="text-xs bg-gray-50 p-3 rounded border">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    Technical Details (Error ID: {this.state.errorId})
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.name}
                    </div>
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={this.handleRetry} size="sm" disabled={this.state.retryCount >= 3}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>

                {isRouteLevel && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={this.handleGoBack}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Go Back
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={this.handleGoHome}
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go Home
                    </Button>
                  </>
                )}
              </div>

              {process.env.NODE_ENV === 'production' && (
                <p className="text-xs text-muted-foreground">
                  If this problem persists, please contact support and reference error ID: {this.state.errorId}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    // You could also send this to an error reporting service
  };
}