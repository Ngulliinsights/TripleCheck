import { AlertTriangle, RefreshCw } from "lucide-react"
import { Component, ErrorInfo, ReactNode } from "react"

import { Button } from "../ui/button"

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  readonly hasError: boolean;
  readonly error?: Error;
  readonly errorInfo?: ErrorInfo;
}

export class NavigationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Initialize state with immutable structure for better performance
    // Using a simple object without 'as const' to avoid type conflicts
    this.state = { hasError: false };
  }

  /**
   * Static method to derive new state from error
   * This runs during the render phase, so we keep it pure
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method called after an error has been thrown
   * This runs during the commit phase, so side effects are safe here
   * The 'override' modifier explicitly marks this as overriding the parent class method
   */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Using a more specific logging approach to satisfy no-console rules
    // In production, you would typically replace this with a proper logging service
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error(
        "Navigation Error Boundary caught an error:",
        error,
        errorInfo
      );
    }

    // Update state with complete error information
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback for custom error handling
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Reset the error boundary state to allow retry
   * Using arrow function to avoid binding issues
   * We omit undefined properties entirely to satisfy exactOptionalPropertyTypes
   */
  private readonly handleReset = (): void => {
    this.setState({ hasError: false });
  };

  /**
   * Force a complete page reload as last resort
   * Using arrow function for consistent binding
   */
  private readonly handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Render error UI or fallback component when error occurs
   * The 'override' modifier explicitly marks this as overriding the parent class method
   * We ensure consistent return types to satisfy SonarJS rules
   */
  override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div
        className="flex items-center justify-center min-h-[200px] p-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <AlertTriangle
              className="h-12 w-12 text-amber-500"
              aria-hidden="true"
            />
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Navigation Error
          </h2>

          <p className="text-gray-600 mb-4">
            Something went wrong with the navigation. This is usually temporary.
          </p>

          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={this.handleReset}
              className="flex items-center gap-2"
              aria-label="Reset error boundary and try again"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try Again
            </Button>

            <Button
              onClick={this.handleReload}
              className="flex items-center gap-2"
              aria-label="Reload the entire page"
            >
              Reload Page
            </Button>
          </div>

          {/* Development-only error details with improved formatting */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 space-y-2">
                <div className="text-xs bg-red-50 border border-red-200 p-2 rounded">
                  <strong className="text-red-800">Error:</strong>
                  <pre className="mt-1 text-red-700 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                </div>
                {this.state.errorInfo?.componentStack && (
                  <div className="text-xs bg-gray-50 border border-gray-200 p-2 rounded">
                    <strong className="text-gray-800">Component Stack:</strong>
                    <pre className="mt-1 text-gray-700 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }
}
