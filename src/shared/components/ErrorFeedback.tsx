/**
 * Error Feedback Components
 * User-friendly error messages and recovery actions
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'error',
  actions = [],
  className = ''
}) => {
  const typeStyles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800'
  };

  const iconColor = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  };

  return (
    <Alert className={`${typeStyles[type]} ${className}`}>
      <AlertTriangle className={`h-4 w-4 ${iconColor[type]}`} />
      <AlertDescription>
        <div className="flex flex-col gap-2">
          {title && <p className="font-medium">{title}</p>}
          <p>{message}</p>
          {actions.length > 0 && (
            <div className="flex gap-2 mt-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'ghost'}
                  size="sm"
                  onClick={action.onClick}
                  className="h-auto py-1 px-2"
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
};inter
face NetworkErrorProps {
  isOnline: boolean;
  onRetry?: () => void;
  className?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  isOnline,
  onRetry,
  className = ''
}) => {
  if (isOnline) return null;

  return (
    <ErrorMessage
      title="Connection Lost"
      message="You're currently offline. Please check your internet connection."
      type="warning"
      actions={onRetry ? [{ label: 'Retry', onClick: onRetry }] : []}
      className={className}
    />
  );
};

interface ApiErrorProps {
  error: any;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export const ApiError: React.FC<ApiErrorProps> = ({
  error,
  onRetry,
  onGoHome,
  className = ''
}) => {
  const getErrorMessage = (error: any) => {
    if (error?.response?.status === 404) {
      return "The requested resource was not found.";
    }
    if (error?.response?.status === 500) {
      return "Server error. Please try again later.";
    }
    if (error?.response?.status === 403) {
      return "You don't have permission to access this resource.";
    }
    return error?.message || "An unexpected error occurred.";
  };

  const actions = [];
  if (onRetry) actions.push({ label: 'Try Again', onClick: onRetry });
  if (onGoHome) actions.push({ label: 'Go Home', onClick: onGoHome, variant: 'outline' as const });

  return (
    <ErrorMessage
      title="Request Failed"
      message={getErrorMessage(error)}
      type="error"
      actions={actions}
      className={className}
    />
  );
};

interface FormErrorProps {
  errors: Record<string, string>;
  generalError?: string;
  onClear?: () => void;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({
  errors,
  generalError,
  onClear,
  className = ''
}) => {
  const hasErrors = Object.keys(errors).length > 0 || generalError;
  
  if (!hasErrors) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {generalError && (
        <ErrorMessage
          message={generalError}
          type="error"
          actions={onClear ? [{ label: 'Clear', onClick: onClear }] : []}
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
};

interface ErrorDetailsProps {
  error: Error;
  errorId?: string;
  showDetails?: boolean;
  onCopyDetails?: () => void;
  className?: string;
}

export const ErrorDetails: React.FC<ErrorDetailsProps> = ({
  error,
  errorId,
  showDetails = false,
  onCopyDetails,
  className = ''
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const details = {
      message: error.message,
      stack: error.stack,
      errorId,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopyDetails?.();
  };

  if (!showDetails) return null;

  return (
    <Card className={`border-red-200 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-red-800 flex items-center justify-between">
          Error Details
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-auto p-1"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-medium">Message:</span>
            <p className="text-gray-600 mt-1">{error.message}</p>
          </div>
          {errorId && (
            <div>
              <span className="font-medium">Error ID:</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {errorId}
              </Badge>
            </div>
          )}
          <div>
            <span className="font-medium">Time:</span>
            <p className="text-gray-600 mt-1">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};