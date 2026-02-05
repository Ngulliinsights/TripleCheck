/**
 * Loading States and Indicators
 * Comprehensive loading UI components for different scenarios
 */

import React from 'react'
import { Loader2, Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Progress } from './ui/progress'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Loading',
  description = 'Please wait while we load your content...',
  showProgress = false,
  progress = 0
}) => {
  return (
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
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500 mt-1 text-center">{progress}% complete</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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
  className = ''
}) => {
  if (isOnline && isConnected) {
    return null; // Don't show anything when everything is working
  }

  return (
    <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-orange-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription className="flex-1">
          {!isOnline ? (
            'You are currently offline. Some features may not be available.'
          ) : !isConnected ? (
            'Connection issues detected. Trying to reconnect...'
          ) : null}
        </AlertDescription>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-auto p-1"
          >
            Retry
          </Button>
        )}
      </div>
    </Alert>
  );
};

interface AsyncOperationStatusProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  successMessage?: string;
  loadingMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export const AsyncOperationStatus: React.FC<AsyncOperationStatusProps> = ({
  status,
  error,
  successMessage = 'Operation completed successfully',
  loadingMessage = 'Processing...',
  onRetry,
  className = ''
}) => {
  if (status === 'idle') {
    return null;
  }

  if (status === 'loading') {
    return (
      <div className={`flex items-center gap-2 text-blue-600 ${className}`}>
        <LoadingSpinner size="sm" />
        <span className="text-sm">{loadingMessage}</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">{successMessage}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Alert className={`border-red-200 bg-red-50 ${className}`}>
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 flex items-center justify-between">
          <span>{error || 'An error occurred'}</span>
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
  }

  return null;
};

interface PageLoadingProps {
  message?: string;
  showSkeleton?: boolean;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Loading page...',
  showSkeleton = false
}) => {
  if (showSkeleton) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
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

interface TimeoutErrorProps {
  onRetry: () => void;
  timeout?: number;
  message?: string;
}

export const TimeoutError: React.FC<TimeoutErrorProps> = ({
  onRetry,
  timeout = 30,
  message = 'The request is taking longer than expected'
}) => {
  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <Clock className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{message}</p>
            <p className="text-sm mt-1">
              This usually takes less than {timeout} seconds.
            </p>
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
};

/**
 * Hook for managing loading states
 */
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = React.useCallback((errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    clearError
  };
};