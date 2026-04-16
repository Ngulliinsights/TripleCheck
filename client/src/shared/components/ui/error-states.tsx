import { RefreshCw, AlertCircle, Wifi, Server } from "lucide-react"
import { memo } from "react"

import { Button } from "./button"

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "network" | "server" | "generic" | "timeout";
  isRetrying?: boolean;
}

const ERROR_CONFIGS = {
  network: {
    icon: Wifi,
    title: "Connection Error",
    message: "Please check your internet connection and try again.",
    retryLabel: "Try Again"
  },
  server: {
    icon: Server,
    title: "Server Error",
    message: "Our servers are experiencing issues. Please try again later.",
    retryLabel: "Retry"
  },
  timeout: {
    icon: RefreshCw,
    title: "Request Timeout",
    message: "The request took too long. Please try again.",
    retryLabel: "Try Again"
  },
  generic: {
    icon: AlertCircle,
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    retryLabel: "Try Again"
  }
};

export const ErrorState = memo<ErrorStateProps>(({
  title,
  message,
  onRetry,
  retryLabel,
  variant = "generic",
  isRetrying = false
}) => {
  const config = ERROR_CONFIGS[variant];
  const Icon = config.icon;
  
  return (
    <div className="text-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-red-800 mb-2">
          {title || config.title}
        </h3>
        <p className="text-red-600 mb-4">
          {message || config.message}
        </p>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            variant="coral-outline" 
            className="border-red-200 text-red-600 hover:bg-red-50"
            disabled={isRetrying}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : (retryLabel || config.retryLabel)}
          </Button>
        )}
      </div>
    </div>
  );
});

ErrorState.displayName = "ErrorState";

// Specific error components for common use cases
export const NetworkError = memo<Pick<ErrorStateProps, 'onRetry' | 'isRetrying'>>(
  ({ onRetry, isRetrying }) => (
    <ErrorState variant="network" {...(onRetry && { onRetry })} {...(isRetrying !== undefined && { isRetrying })} />
  )
);

export const ServerError = memo<Pick<ErrorStateProps, 'onRetry' | 'isRetrying'>>(
  ({ onRetry, isRetrying }) => (
    <ErrorState variant="server" {...(onRetry && { onRetry })} {...(isRetrying !== undefined && { isRetrying })} />
  )
);

export const TimeoutError = memo<Pick<ErrorStateProps, 'onRetry' | 'isRetrying'>>(
  ({ onRetry, isRetrying }) => (
    <ErrorState variant="timeout" {...(onRetry && { onRetry })} {...(isRetrying !== undefined && { isRetrying })} />
  )
);

NetworkError.displayName = "NetworkError";
ServerError.displayName = "ServerError";
TimeoutError.displayName = "TimeoutError";