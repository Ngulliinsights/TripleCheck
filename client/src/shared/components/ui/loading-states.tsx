import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import React from "react"

import { Button } from "./button"
import { Card, CardContent, CardHeader } from "./card"
import { Skeleton } from "./skeleton"

// Property card skeleton
export function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <Skeleton className="h-48 w-full" />
        <div className="absolute top-2 right-2">
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <Skeleton className="h-5 w-1/3 mb-3" />
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// Property grid skeleton
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Loading spinner
export function LoadingSpinner({ size = "default", text }: { size?: "sm" | "default" | "lg"; text?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className="flex items-center justify-center gap-2 p-4">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Error state component
export function ErrorState({ 
  title = "Something went wrong", 
  message = "We encountered an error while loading data.",
  onRetry,
  showRetry = true 
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-red-600">{title}</h3>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Empty state component
export function EmptyState({ 
  title = "No data found", 
  message = "There's nothing to show here yet.",
  action
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="text-center py-8 space-y-4">
        <div className="text-4xl">📭</div>
        <div>
          <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
        {action && <div>{action}</div>}
      </CardContent>
    </Card>
  );
}

// Data container with loading states
export function DataContainer<T>({
  data,
  isLoading,
  error,
  onRetry,
  loadingSkeleton,
  emptyState,
  children
}: {
  data: T;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  loadingSkeleton?: React.ReactNode;
  emptyState?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}) {
  if (isLoading) {
    return <>{loadingSkeleton || <LoadingSpinner text="Loading..." />}</>;
  }

  if (error) {
    return (
      <ErrorState 
        title="Failed to load data"
        message={error.message || "An unexpected error occurred"}
        {...(onRetry && { onRetry })}
      />
    );
  }

  // Check if data is empty (array, object, or null)
  const isEmpty = !data || 
    (Array.isArray(data) && data.length === 0) ||
    (typeof data === 'object' && Object.keys(data).length === 0);

  if (isEmpty) {
    return <>{emptyState || <EmptyState />}</>;
  }

  return <>{children(data)}</>;
}