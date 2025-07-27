import React, { Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '../shared/components/ui/toaster';
import { ErrorBoundary } from './error-boundary';
import { createEnhancedQueryClient } from '../infrastructure/cache/query-cache';

// Lazy load devtools only in development
const ReactQueryDevtools = process.env.NODE_ENV === 'development' 
  ? React.lazy(() => 
      import('@tanstack/react-query-devtools').then(module => ({
        default: module.ReactQueryDevtools
      })).catch(() => ({
        default: () => null // Fallback if devtools not available
      }))
    )
  : null;

const queryClient = createEnhancedQueryClient();

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}