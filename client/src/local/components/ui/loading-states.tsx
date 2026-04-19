import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import React from "react";

import { Alert, AlertDescription } from "./alert";
import { Button } from "./button";
import { Card, CardContent, CardHeader } from "./card";
import { Progress } from "./progress";
import { Skeleton } from "./skeleton";

// ─── Utilities ───────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

export function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <Skeleton className="h-48 w-full" />
        <div className="absolute top-2 right-2">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <div className="flex items-center justify-between pt-1">
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

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-6" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-8 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Spinners & Inline Loading ────────────────────────────────────────────────

const SPINNER_SIZES = { sm: "h-4 w-4", default: "h-6 w-6", lg: "h-8 w-8" } as const;

interface LoadingSpinnerProps {
  size?: keyof typeof SPINNER_SIZES;
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = "default", text, className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2 p-4", className)}
      role="status"
      aria-label={text ?? "Loading"}
    >
      <Loader2 className={cn("animate-spin shrink-0", SPINNER_SIZES[size])} aria-hidden="true" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// ─── Page-Level Loading ───────────────────────────────────────────────────────

interface PageLoadingProps {
  message?: string;
  showSkeleton?: boolean;
}

export function PageLoading({ message = "Loading page…", showSkeleton = false }: PageLoadingProps) {
  if (showSkeleton) return <PageSkeleton />;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="animate-spin w-8 h-8" aria-hidden="true" />
            <div>
              <h3 className="font-medium text-gray-900">Loading</h3>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Overlay Loading ──────────────────────────────────────────────────────────

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  message = "Loading…",
  className,
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin w-8 h-8" aria-hidden="true" />
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Error & Empty States ─────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error while loading data.",
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <Card className="max-w-md mx-auto" role="alert">
      <CardHeader className="text-center pb-2">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-red-600">{title}</h3>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No data found",
  message = "There's nothing to show here yet.",
  icon = "📭",
  action,
}: EmptyStateProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="text-center py-8 space-y-4">
        <div className="text-4xl" role="img" aria-hidden="true">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

// ─── Data Container ───────────────────────────────────────────────────────────

function isDataEmpty(data: unknown): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") return Object.keys(data as object).length === 0;
  return false;
}

interface DataContainerProps<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  loadingSkeleton?: React.ReactNode;
  emptyState?: React.ReactNode;
  children: (data: NonNullable<T>) => React.ReactNode;
}

export function DataContainer<T>({
  data,
  isLoading,
  error,
  onRetry,
  loadingSkeleton,
  emptyState,
  children,
}: DataContainerProps<T>) {
  if (isLoading) return <>{loadingSkeleton ?? <LoadingSpinner text="Loading…" />}</>;

  if (error) {
    return (
      <ErrorState
        title="Failed to load data"
        message={error.message || "An unexpected error occurred."}
        onRetry={onRetry}
      />
    );
  }

  if (isDataEmpty(data)) return <>{emptyState ?? <EmptyState />}</>;

  return <>{children(data as NonNullable<T>)}</>;
}

// ─── Network Status ───────────────────────────────────────────────────────────

interface NetworkStatusProps {
  isOnline: boolean;
  isConnected: boolean;
  onRetry?: () => void;
  className?: string;
}

export function NetworkStatus({ isOnline, isConnected, onRetry, className }: NetworkStatusProps) {
  if (isOnline && isConnected) return null;

  const offline = !isOnline;
  const message = offline
    ? "You are currently offline. Some features may not be available."
    : "Connection issues detected. Trying to reconnect…";

  return (
    <Alert className={cn("border-orange-200 bg-orange-50", className)} role="status">
      <div className="flex items-center gap-2">
        {offline ? (
          <WifiOff className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
        ) : (
          <Wifi className="h-4 w-4 text-orange-600 shrink-0" aria-hidden="true" />
        )}
        <AlertDescription className="flex-1">{message}</AlertDescription>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="h-auto p-1 shrink-0">
            Retry
          </Button>
        )}
      </div>
    </Alert>
  );
}

// ─── Async Operation Status ───────────────────────────────────────────────────

type AsyncStatus = "idle" | "loading" | "success" | "error";

interface AsyncOperationStatusProps {
  status: AsyncStatus;
  error?: string;
  successMessage?: string;
  loadingMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export function AsyncOperationStatus({
  status,
  error,
  successMessage = "Operation completed successfully",
  loadingMessage = "Processing…",
  onRetry,
  className,
}: AsyncOperationStatusProps) {
  if (status === "idle") return null;

  if (status === "loading") {
    return (
      <div
        className={cn("flex items-center gap-2 text-blue-600", className)}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="animate-spin w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="text-sm">{loadingMessage}</span>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        className={cn("flex items-center gap-2 text-green-600", className)}
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="text-sm">{successMessage}</span>
      </div>
    );
  }

  return (
    <Alert className={cn("border-red-200 bg-red-50", className)} role="alert">
      <AlertCircle className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
      <AlertDescription className="text-red-800 flex items-center justify-between gap-2">
        <span>{error ?? "An error occurred."}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-auto p-1 shrink-0 text-red-600 hover:text-red-800"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// ─── Timeout Error ────────────────────────────────────────────────────────────

interface TimeoutErrorProps {
  onRetry: () => void;
  timeout?: number;
  message?: string;
  className?: string;
}

export function TimeoutError({
  onRetry,
  timeout = 30,
  message = "The request is taking longer than expected",
  className,
}: TimeoutErrorProps) {
  return (
    <Alert className={cn("border-yellow-200 bg-yellow-50", className)} role="alert">
      <Clock className="h-4 w-4 text-yellow-600 shrink-0" aria-hidden="true" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">{message}</p>
            <p className="text-sm mt-0.5">This usually takes less than {timeout} seconds.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="shrink-0 text-yellow-600 hover:text-yellow-800"
          >
            Try Again
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}