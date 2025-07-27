import React from 'react';
import { Skeleton } from './skeleton';
import { Loader2 } from 'lucide-react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'page' | 'card' | 'list' | 'minimal' | 'detailed' | 'property' | 'dashboard' | 'form' | 'table' | 'navigation';
  showSpinner?: boolean;
  title?: string;
  description?: string;
  itemCount?: number;
}

export function LoadingSkeleton({ 
  className, 
  variant = 'page', 
  showSpinner = false,
  title,
  description,
  itemCount = 6
}: LoadingSkeletonProps) {
  // Prevent layout shift by using fixed dimensions that match actual content
  const baseClasses = "animate-pulse";
  
  // Loading header component for variants that need it
  const LoadingHeader = ({ showTitle = true, showDescription = true }) => (
    <div className="space-y-3 mb-6">
      {showSpinner && (
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}
      {showTitle && (
        <Skeleton className="h-8 w-3/4 max-w-md" />
      )}
      {showDescription && (
        <>
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-2/3 max-w-xl" />
        </>
      )}
    </div>
  );

  if (variant === 'minimal') {
    return (
      <div className={`${baseClasses} space-y-2 ${className}`}>
        {showSpinner && (
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        )}
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} space-y-3 ${className}`}>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex space-x-2 pt-2">
          <Skeleton className="h-8 w-16 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`${baseClasses} space-y-4 ${className}`}>
        <LoadingHeader showDescription={false} />
        {Array.from({ length: itemCount }, (_, i) => (
          <div key={i} className="flex space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`${baseClasses} ${className}`} style={{ minHeight: '500px' }}>
        <LoadingHeader />
        
        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Primary content */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'property') {
    return (
      <div className={`${baseClasses} ${className}`} style={{ minHeight: '600px' }}>
        <LoadingHeader />
        
        {/* Property image gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Skeleton className="aspect-[4/3] rounded-lg" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        
        {/* Property details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <div className="flex space-x-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className={`${baseClasses} ${className}`} style={{ minHeight: '700px' }}>
        <LoadingHeader />
        
        {/* Dashboard stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        
        {/* Dashboard content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 border rounded">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={`${baseClasses} space-y-6 ${className}`}>
        <LoadingHeader showDescription={false} />
        
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          ))}
        </div>
        
        <div className="flex space-x-3 pt-4">
          <Skeleton className="h-10 w-24 rounded" />
          <Skeleton className="h-10 w-20 rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`${baseClasses} space-y-4 ${className}`}>
        <LoadingHeader showDescription={false} />
        
        {/* Table header */}
        <div className="flex space-x-4 p-4 border-b">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        
        {/* Table rows */}
        {Array.from({ length: itemCount }, (_, i) => (
          <div key={i} className="flex space-x-4 p-4 border-b">
            {Array.from({ length: 4 }, (_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'navigation') {
    return (
      <div className={`${baseClasses} space-y-2 ${className}`}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center space-x-3 p-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1 max-w-32" />
          </div>
        ))}
      </div>
    );
  }

  // Default 'page' variant with fixed dimensions to prevent CLS
  return (
    <div className={`${baseClasses} ${className}`} style={{ minHeight: '600px' }}>
      <LoadingHeader />
      
      {/* Content grid with fixed aspect ratios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: itemCount }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-12 rounded" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}