import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { AlertTriangle, RefreshCw } from "lucide-react"
import React, { Component, ErrorInfo } from "react"

interface QueryErrorFallbackProps {
  readonly error: Error;
  readonly resetErrorBoundary: () => void;
}

function QueryErrorFallback({
  error,
  resetErrorBoundary,
}: QueryErrorFallbackProps) {
  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {error.message || "An unexpected error occurred while loading data."}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={resetErrorBoundary}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface QueryErrorBoundaryProps {
  readonly children: React.ReactNode;
  readonly fallback?: React.ComponentType<QueryErrorFallbackProps> | undefined;
}

interface QueryErrorBoundaryState {
  hasError: boolean;
  error?: Error | undefined;
}

/**
 * Custom Error Boundary that works with React Query
 * Provides customizable fallback UI and reset functionality
 */
class QueryErrorBoundaryClass extends Component<
  QueryErrorBoundaryProps & { resetErrorBoundary: () => void },
  QueryErrorBoundaryState
> {
  constructor(props: QueryErrorBoundaryProps & { resetErrorBoundary: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): QueryErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Query Error Boundary caught an error:', error, errorInfo);
  }

  override componentDidUpdate(prevProps: QueryErrorBoundaryProps & { resetErrorBoundary: () => void }) {
    const { resetErrorBoundary } = this.props;
    const { hasError } = this.state;
    
    if (hasError && prevProps.resetErrorBoundary !== resetErrorBoundary) {
      this.setState({ hasError: false });
    }
  }

  override render() {
    const { hasError, error } = this.state;
    const { children, fallback: Fallback = QueryErrorFallback, resetErrorBoundary } = this.props;

    if (hasError && error) {
      return <Fallback error={error} resetErrorBoundary={resetErrorBoundary} />;
    }

    return children;
  }
}

/**
 * Error boundary specifically designed for React Query errors
 * Prevents race conditions and provides graceful error handling
 */
export function QueryErrorBoundary({
  children,
  fallback,
}: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <QueryErrorBoundaryClass
          fallback={fallback}
          resetErrorBoundary={reset}
        >
          {children}
        </QueryErrorBoundaryClass>
      )}
    </QueryErrorResetBoundary>
  );
}
