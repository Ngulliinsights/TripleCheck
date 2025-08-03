import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import React from 'react';

import { ErrorBoundary } from '@/app/error-boundary';

interface QueryErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function QueryErrorFallback({ error, resetErrorBoundary }: QueryErrorFallbackProps) {
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
          {error.message || 'An unexpected error occurred while loading data.'}
        </p>
        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<QueryErrorFallbackProps>;
}

/**
 * Error boundary specifically designed for React Query errors
 * Prevents race conditions and provides graceful error handling
 */
export function QueryErrorBoundary({ children, fallback: Fallback = QueryErrorFallback }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={
            <Fallback 
              error={new Error('An error occurred')} 
              resetErrorBoundary={reset} 
            />
          }
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}