import React, { Suspense } from 'react'

import { NavigationErrorBoundary } from './NavigationErrorBoundary'

interface SafeNavigationProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

// Safe loading fallback component
const NavigationLoadingFallback = () => (
  <div className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="hidden lg:flex space-x-6">
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-64 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-24 h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

// Safe navigation fallback when navigation fails
const NavigationFallback = () => (
  <div className="fixed top-0 w-full z-50 bg-white shadow-sm border-b border-gray-200">
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a 
            href="/" 
            className="text-xl font-bold text-primary hover:opacity-80 transition-opacity"
          >
            TripleCheck
          </a>
        </div>
        <div className="flex items-center space-x-4">
          <a 
            href="/properties" 
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            Properties
          </a>
          <a 
            href="/services/basic-checks" 
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            Verify
          </a>
          <a 
            href="/auth/login" 
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  </div>
);

/**
 * SafeNavigation wrapper component that provides error boundaries and loading states
 * for navigation components to prevent crashes from affecting the entire application
 */
export function SafeNavigation({ 
  children, 
  fallback, 
  loadingFallback 
}: SafeNavigationProps) {
  return (
    <NavigationErrorBoundary
      fallback={fallback || <NavigationFallback />}
      onError={(error, errorInfo) => {
        // Log navigation errors for debugging
        if (process.env.NODE_ENV === 'development') {
          console.error('Navigation component error:', error, errorInfo);
        }
        
        // In production, you might want to send this to an error tracking service
        // errorTrackingService.captureException(error, { extra: errorInfo });
      }}
    >
      <Suspense fallback={loadingFallback || <NavigationLoadingFallback />}>
        {children}
      </Suspense>
    </NavigationErrorBoundary>
  );
}

// Export individual safe navigation components
export const SafeEnhancedNavigation = ({ children, ...props }: SafeNavigationProps) => (
  <SafeNavigation {...props}>
    {children}
  </SafeNavigation>
);

export const SafeMobileNav = ({ children, ...props }: SafeNavigationProps) => (
  <SafeNavigation {...props}>
    {children}
  </SafeNavigation>
);